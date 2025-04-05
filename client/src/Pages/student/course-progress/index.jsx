import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/video-player";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import { Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentCourseProgressService, markLectureAsViewedService, resetCourseProgressService } from "@/service";

function StudentViewCourseProgressPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { studentCurrentCourseProgress, setStudentCurrentCourseProgress } =
    useContext(StudentContext);
  const [lockCourse, setLockCourse] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [showCourseCompleteDialog, setShowCourseCompleteDialog] =
    useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const { id } = useParams();

  async function fetchCurrentCourseProgress() {
    try {
      const response = await getCurrentCourseProgressService(auth?.user?._id, id);
      if (response?.success) {
        if (!response?.data?.isPurchased) {
          setLockCourse(true);
          return;
        }
  
        setStudentCurrentCourseProgress({
          courseDetails: response?.data?.courseDetails,
          progress: response?.data?.progress,
        });
  
        if (response?.data?.completed) {
          setCurrentLecture(response?.data?.courseDetails?.curriculum[0]);
          setShowCourseCompleteDialog(true);
          setShowConfetti(true);
          return;
        }
  
        const curriculum = response?.data?.courseDetails?.curriculum || [];
        const progress = response?.data?.progress || [];
  
        if (curriculum.length === 0) {
          console.error("❌ No lectures found in the curriculum.");
          return;
        }
  
        const nextLecture = curriculum.find((lecture) => {
          const lectureProgress = progress.find((p) => p.lectureId === lecture._id);
          return !lectureProgress?.viewed;
        });
  
        setCurrentLecture(nextLecture || curriculum[0]);
      } else {
        console.error("❌ Failed to fetch course progress:", response);
      }
    } catch (error) {
      console.error("❌ Error fetching course progress:", error);
    }
  }

  async function updateCourseProgress() {
    if (currentLecture) {
      const isAlreadyViewed = studentCurrentCourseProgress?.progress?.find(
        (item) => item.lectureId === currentLecture._id
      )?.viewed;

      if (!isAlreadyViewed) {
        const response = await markLectureAsViewedService(
          auth?.user?._id,
          studentCurrentCourseProgress?.courseDetails?._id,
          currentLecture._id
        );

        if (response?.success) {
          fetchCurrentCourseProgress();
        }
      }
    }
  }

  async function handleRewatchCourse() {
    const response = await resetCourseProgressService(
      auth?.user?._id,
      studentCurrentCourseProgress?.courseDetails?._id
    );

    if (response?.success) {
      setCurrentLecture(null);
      setShowConfetti(false);
      setShowCourseCompleteDialog(false);
      fetchCurrentCourseProgress();
    }
  }

  useEffect(() => {
    fetchCurrentCourseProgress();
  }, [id]);

  useEffect(() => {
    if (currentLecture?.progressValue === 1) updateCourseProgress();
  }, [currentLecture]);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div className="flex flex-col h-screen bg-[#1c1d1f] text-white">
      {showConfetti && <Confetti />}
      <div className="flex items-center justify-between p-4 bg-[#1c1d1f] border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/student-courses")}
            className="text-black"
            variant="ghost"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to My Courses Page
          </Button>
          <h1 className="text-lg font-bold hidden md:block">
            {studentCurrentCourseProgress?.courseDetails?.title}
          </h1>
        </div>
        <Button onClick={() => setIsSideBarOpen(!isSideBarOpen)}>
          {isSideBarOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`flex-1 ${isSideBarOpen ? "mr-[400px]" : ""
            } transition-all duration-300`}
        >
          {currentLecture ? (
            <>
              <VideoPlayer
                width="100%"
                height="500px"
                url={currentLecture?.videoUrl}
                onProgressUpdate={setCurrentLecture}
                progressData={currentLecture}
              />
              <div className="p-6 bg-[#1c1d1f]">
                <h2 className="text-2xl font-bold mb-2">{currentLecture?.title}</h2>
              </div>
            </>
          ) : (
            <div className="p-6 bg-[#1c1d1f]">
              <h2 className="text-2xl font-bold mb-2">No Lecture Available</h2>
            </div>
          )}
        </div>
        <div
          className={`fixed top-[64px] right-0 bottom-0 w-[400px] bg-[#1c1d1f] border-l border-gray-700 transition-all duration-300 ${isSideBarOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <Tabs defaultValue="content" className="h-full flex flex-col">
            <TabsList className="grid bg-[#1c1d1f] w-full grid-cols-2 p-0 h-14">
              <TabsTrigger
                value="content"
                className="text-black rounded-none h-full"
              >
                Course Content
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="text-black rounded-none h-full"
              >
                Overview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {studentCurrentCourseProgress?.courseDetails?.curriculum?.map(
                    (item) => (
                      <div
                        className="flex items-center space-x-2 text-sm text-white font-bold cursor-pointer"
                        key={item._id}
                        onClick={() => setCurrentLecture(item)}
                      >
                        {studentCurrentCourseProgress?.progress?.find(
                          (progressItem) => progressItem.lectureId === item._id
                        )?.viewed ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        <span>{item?.title}</span>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="overview" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-4">About this course</h2>
                  <p className="text-gray-400">
                    {studentCurrentCourseProgress?.courseDetails?.description}
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lock Course Dialog */}
      <Dialog open={lockCourse}>
        <DialogContent className="sm:w-[425px]">
          <DialogHeader>
            <DialogTitle>You can't view this page</DialogTitle>
            <DialogDescription>
              Please purchase this course to get access
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Course Complete Dialog */}
      <Dialog open={showCourseCompleteDialog}>
        <DialogContent className="sm:w-[425px]">
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
            <DialogDescription>
              You have completed the course
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button onClick={() => navigate("/student-courses")}>
              My Courses Page
            </Button>
            <Button onClick={handleRewatchCourse}>Rewatch Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseProgressPage;