import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { type RootState } from "@/store";
import { Button, Box } from "@mui/material";

type FlashCardType = {
  id: number;
  module_id: number;
  difficulty?: string;
  question_en: string;
  answer_en: string;
};

interface ExpandMoreProps {
  expand: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }: any) => ({
  marginLeft: "auto",
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

export default function FlashcardsPage() {
  const { moduleId, id } = useParams<{ moduleId: string; id: string }>();
  const navigate = useNavigate();
  const [cards, setCards] = useState<FlashCardType[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const BaseUrl = import.meta.env.VITE_API_BASE_URL;
    const language = useSelector((state: RootState) => state.language);
    const lang = language.lang;

     const isArabic = lang === "ar";

  const next = useSelector((state: RootState) => state.Next);
  const nextSection = next?.SectionId;
  const nextCourse = next?.CourseId;

  useEffect(() => {
    if (!moduleId) return;

    const fetchFlashcards = async () => {
      try {
        const response = await fetch(
          `${BaseUrl}/courses/${moduleId}/flashcards`
        );
        if (!response.ok) throw new Error("Failed to fetch flashcards");
        const data: FlashCardType[] = await response.json();
        setCards(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [moduleId]);

  if (loading) return <p>Loading flashcards...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1000px",
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "center",
      }}
    >
      {cards.map((card) => (
        <Card
          key={card.id}
          sx={{
            width: 300,
            cursor: "pointer",
            borderRadius: 2,
            boxShadow: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6">
              {card.difficulty && `| ${card.difficulty}`}
            </Typography>
            <Typography
              sx={{
                marginTop: 1,
                direction: isArabic ? "rtl" : "ltr", // RTL for Arabic
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {card[`question_${lang}` as keyof typeof card]}
            </Typography>
          </CardContent>
          <CardActions disableSpacing>
            <ExpandMore
              expand={expandedId === card.id}
              onClick={() =>
                setExpandedId(expandedId === card.id ? null : card.id)
              }
            >
              <ExpandMoreIcon />
            </ExpandMore>
          </CardActions>
          <Collapse in={expandedId === card.id} timeout="auto" unmountOnExit>
            <CardContent>
              <Typography
                sx={{
                  
                  direction: isArabic ? "rtl" : "ltr", // RTL for Arabic
                  textAlign: isArabic ? "right" : "left",
                }}
              >
                {card[`answer_${lang}` as keyof typeof card]}
              </Typography>
            </CardContent>
          </Collapse>
        </Card>
      ))}

      {/* Button at bottom left */}
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          left: 20,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (nextSection === 0) {
              navigate(`/courses/${id}/exam`);
            } else {
              navigate(
                `/courses/${nextCourse}/modules/${moduleId}/sections/${nextSection}`
              );
            }
          }}
        >
          Go to Next Section
        </Button>
      </Box>
    </div>
  );
}
